-- SQL Script to migrate data from JSONB format into the new relational tables
-- Run this in the Supabase SQL Editor.

DO $$
DECLARE
    p_record RECORD;
    list_record RECORD;
    todo_record RECORD;
    new_list_id UUID;
    v_lists JSONB;
BEGIN
    -- Loop through all projects
    FOR p_record IN SELECT id, data FROM projects LOOP
        
        -- Make sure we have a lists array
        IF jsonb_typeof(p_record.data->'lists') = 'array' THEN
            v_lists := p_record.data->'lists';
            
            -- Loop through each list in the array
            FOR list_record IN SELECT * FROM jsonb_array_elements(v_lists) LOOP
                
                -- Insert the list and get the new generated UUID
                INSERT INTO lists (project_id, name) 
                VALUES (p_record.id, list_record.value->>'name')
                RETURNING id INTO new_list_id;
                
                -- Now loop through todos in this list
                IF jsonb_typeof(list_record.value->'todos') = 'array' THEN
                    FOR todo_record IN SELECT * FROM jsonb_array_elements(list_record.value->'todos') LOOP
                        
                        -- Insert the todo
                        INSERT INTO todos (
                            list_id, 
                            text, 
                            assignee, 
                            due, 
                            done
                        ) VALUES (
                            new_list_id,
                            todo_record.value->>'text',
                            NULLIF(todo_record.value->>'assignee', ''),
                            NULLIF(todo_record.value->>'due', ''),
                            COALESCE((todo_record.value->>'done')::boolean, false)
                        );
                        
                    END LOOP;
                END IF;

            END LOOP;
            
            -- Remove lists from the JSONB payload so it isn't duplicated
            UPDATE projects 
            SET data = data - 'lists'
            WHERE id = p_record.id;
            
        END IF;

    END LOOP;
END $$;
